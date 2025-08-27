package com.tth.RestaurantApplication.service;

import com.tth.RestaurantApplication.dto.response.TableResponse;
import com.tth.RestaurantApplication.entity.TableEntity;
import com.tth.RestaurantApplication.exception.AppException;
import com.tth.RestaurantApplication.exception.ErrorCode;
import com.tth.RestaurantApplication.mapper.TableMapper;
import com.tth.RestaurantApplication.repository.TableRepository;
import com.tth.RestaurantApplication.specification.TableSpecification;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
@Slf4j
public class TableService {
    TableRepository tableRepository;
    TableMapper tableMapper;

    public List<TableResponse> getTablesByParams(Map<String, String > params){
        List<TableEntity> tables = tableRepository.findAll(TableSpecification.filterByParams(params));

        return tables.stream().map(tableMapper::toTableResponse).toList();

    }
    public void updateTableStatus(Integer tableId){
        TableEntity table = this.tableRepository.findById(tableId)
                .orElseThrow(() -> new AppException(ErrorCode.TABLE_NOT_FOUND));
        log.info("table status: {}",table.getStatus().toString());
        if(table.getStatus().toString().equals("BOOKED"))
            table.setStatus(TableEntity.TableStatus.OCCUPIED);
        else
            throw new AppException(ErrorCode.INVALID_TABLE_STATUS);

        tableRepository.save(table);
    }
}
